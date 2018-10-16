# Depurador

<!--introduced_in=v0.9.12-->

> Estabilidad: 2 - Estable

<!-- type=misc -->

Node.js incluye una utilidad de depuración fuera de proceso, de fácil acceso a través de un [V8 Inspector](#debugger_v8_inspector_integration_for_node_js) y un cliente de depuración integrado. Para usarlo, inicie el Node.js con el argumento `inspect`, seguido de la ruta de acceso del script a depurar. Se mostrará un aviso indicando el inicio exitoso del depurador:

```txt
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

El cliente depurador de Node.js no es un depurador que incluye todas las funciones, pero pasos simples y la inspección son permitidas.

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

El comando `repl` permite que el código sea evaluado de forma remota. El comando `next` continúa en la siguiente línea. Escribe `help` para ver los comandos adicionales disponibles.

Presionando `enter` sin escribir un comando repetirá el comando del depurador previo.

## Monitores

Es posible observar los valores variables y de expresión mientras se hace una depuración. Cada expresión de la lista de monitores sera evaluada en el contexto actual y mostrada inmediatamente antes de clasificar las interrupciones del código fuente en cada punto de interrupción.

Escribe `watch('my_expression')` para comenzar con una expresión. El comando `watchers` imprimirá los monitores activos. Por el contrario, escribe `unwatch('my_expression')` para eliminar un monitor.

## Comando de referencia

### Ejecutando paso a paso

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

* `backtrace`, `bt` - Imprimir backtrace del campo de ejecución actual
* `list(5)` - Enumera el código fuente de los scripts con 5 líneas de contexto (5 líneas anteriores y posteriores)
* `watch(expr)` - Agregar la expresión a la lista de monitoreo
* `unwatch(expr)` - Elimina la expresión de la lista de monitoreo
* `watchers` - Enumera los monitores y sus valores (enumerados automáticamente en cada punto de interrupción)
* `repl` - Abrir el repl del depurador para la evaluación en el contexto del script de depuración
* `exec expr` - Ejecuta una expresión en el contexto del script de depuración

### Control de ejecución

* `run` - Ejecuta el script (inicia el depurador automáticamente)
* `restart` - Reinicia el script
* `kill` - Termina el script

### Varios

* `scripts` - Enumera todos los scripts cargados
* `>version` - Muestra la versión de V8

## Uso avanzado

### Integración del Inspector V8 para Node.js

La integración del Inspector V8 permite adjuntar Chrome DevTools a instancias de Node.js para depurar y generar perfiles. Usa el [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

El Inspector V8 puede ser habilitado al pasar la bandera `--inspect` al iniciar una aplicación Node.js. Asimismo, es posible suplir un puerto personalizado con esa bandera. Por ejemplo, el `--inspect=9222` permitirá las conexiones DevTools en el puerto 9222.

Pase la bandera `--inspect-brk`, en vez de `--inspect`, para interrumpir la primera línea del código de aplicación.

```txt
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
Abra la siguiente URL en Chrome para iniciar la depuración: 
    chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(En el ejemplo anterior, la UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 al final de la URL es generada en la salida y varía en las diferentes sesiones de depuración)