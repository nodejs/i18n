# Depurador

<!--introduced_in=v0.9.12-->

> Estabilidad: 2 - estable

<!-- type=misc -->

Node.js incluye un servicio de depurador fuera de proceso de fácil acceso a través de [V8 Inspector](#debugger_v8_inspector_integration_for_node_js) e integrado al cliente de depuración. Para usarlo, inicie el Node.js con el argumento `inspect`, seguido de a ruta de acceso del script a depurar. Se mostrará un aviso indicando el inicio exitoso del depurador:

```txt
$ node inspect myscript.js
<Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< para ayuda, visitar: https://nodejs.org/en/docs/inspector
< Depurador adjunto.
Interrumpir el inicio en myscript.js:1
> 1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
  3   console.log('world');
debug>
```

El cliente depurador de Node.js no es un depurador que incluye todas las funciones, pero un paso simple y la inspección son permitidas.

Insertando la instrucción `debugger;` en el código fuente de un script habilitará un punto de interrupción en esa posición en el código:

<!-- eslint-disable no-debugger -->

```js
// myscript.js
global.x = 5;
setTimeout(() => {
  debugger;
  console.log('world');
}, 1000);
console.log('hello');
```

Un punto de interrupción sucederá en la línea 3 una vez que el depurador sea ejecutado:

```txt
$ node inspect myscript.js
<Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< Para ayuda, visitar: https://nodejs.org/en/docs/inspector
< Depurador adjunto.
Interrupción en el inicio en myscript.js:1
> 1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
  3   debugger;
debug> cont
< hello
Interrupción en myscript.js:3 
  1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
> 3   debugger;
  4   console.log('world');
  5 }, 1000);
debug> next
Interrupción en myscript.js:4
   setTimeout(() => {
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
interrupción en myscript.js:5
  3   debugger;
  4   console.log('world');
> 5 }, 1000);
  6 console.log('hello');
  7
debug> .exit
```

El comando `repl` permite que el código sea evaluado de forma remota. El comando `next` continúa en la siguiente línea. Escribe `help` para ver los comandos adiconales disponibles.

Presionando `enter` sin escribir un comando repetirá el comando del depurador previo.

## Monitores

Es posible observar los valores variables y de expresión mientras se hace una depuración. Cada expresión de la lista de monitores sera evaluada en el contexto actual y mostrada inmediatamente antes de clasificar las interrupciones del código fuente en cada punto de interrupción.

Escribe `watch('my_expression')` para comenzar con una expresión. El comando `watchers` imprimirá los monitores activos. Por el contrario, escribe `unwatch('my_expression')` para eliminar un monitor.

## Comando de referencia

### Ejecuanto paso a paso

* `cont`, `c` - Continúe ejecución
* `next`, `n` - Siguiente paso
* `step`, `s` - Entrar
* `out`, `o` - Salir
* `pause` - Detener ejecución del código (parecido al botón de pausa en las Herramientas para desarrolladores)

### Puntos de interrupción

* `setBreakpoint()`. `sb()` - Seleccionar punto de interrupción en la línea actual
* `setBreakpoint(line)`, `sb(line)` - Colocar un punto de interrupción en una línea específica
* `setBreakpoint('fn()')`, `sb(...)` - Establecer un punto de interrupción en una primera instrucción en las funciones del programa
* `setBreakpoint('script.js', 1)`, `sb(...)` - Establecer un punto de interrupción en la primera línea del `script.js`
* `clearBreakpoint('script.js', 1)`m `cb(...)` - Limpiar el punto de interrupción en `script.js` en la línea 1

Asimismo, es posible colocar un punto de interrupción en un archivo (módulo) que no haya sido cargado aún:

```txt
$ node inspect main.js
< Debugger listening on ws://127.0.0.1:9229/4e3db158-9791-4274-8909-914f7facf3bd
< Para ayuda, visitar: https://nodejs.org/en/docs/inspector
< Depurador adjunto.
Interrumpir al inicio en  main.js:1
>  (function (exports, require, module, __filename, __dirname) { const mod = require('./mod.js');
  2 mod.hello();
  3 mod.hello();
debug> setBreakpoint('mod.js', 22)
Advertencia: script 'mod.js' aún no ha sido cargado.
debug> c
interrupción en mod.js:22
 20 // USO U OTROS TRÁFICOS EN EL SOFTWARE.
 21
>22 exports.hello = function() {
 23   return 'hello from module';
 24 };
debug>
```

### Información

* `backtrace`, `bt` - Imprimir backtrace del campo de ejecución actual
* `list(5)` - Enumera el código fuente de los scripts con 5 líneas de contexto (5 líneas anteriores y posteriores)
* `watch(expr)` - Add expression to watch list
* `unwatch(expr)` - Remove expression from watch list
* `watchers` - List all watchers and their values (automatically listed on each breakpoint)
* `repl` - Open debugger's repl for evaluation in debugging script's context
* `exec expr` - Execute an expression in debugging script's context

### Execution control

* `run` - Run script (automatically runs on debugger's start)
* `restart` - Restart script
* `kill` - Kill script

### Various

* `scripts` - List all loaded scripts
* `version` - Display V8's version

## Advanced Usage

### V8 Inspector Integration for Node.js

V8 Inspector integration allows attaching Chrome DevTools to Node.js instances for debugging and profiling. It uses the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

V8 Inspector can be enabled by passing the `--inspect` flag when starting a Node.js application. It is also possible to supply a custom port with that flag, e.g. `--inspect=9222` will accept DevTools connections on port 9222.

To break on the first line of the application code, pass the `--inspect-brk` flag instead of `--inspect`.

```txt
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(In the example above, the UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 at the end of the URL is generated on the fly, it varies in different debugging sessions.)