# Depurador

<!--introduced_in=v0.9.12-->

> Estability: 2 - Estable

<!-- type=misc -->

Node.js incluye una utilidad de depuración fuera de proceso, de fácil acceso a través de un [V8 Inspector](#debugger_v8_inspector_integration_for_node_js) y un cliente de depuración integrado. To use it, start Node.js with the `inspect` argument followed by the path to the script to debug; a prompt will be displayed indicating successful launch of the debugger:

```txt
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help see https://nodejs.org/en/docs/inspector
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

```txt
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help see https://nodejs.org/en/docs/inspector
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

* ` cont `, ` c ` - Continue ejecución
* `next`, `n` - Próximo paso
* ` paso `, ` s ` - Entrar
* ` out`, `o` - Salir
* `pause` - detenga el código ejecutado (como el botón de pausa en las Herramientas de Desarrollo)

### Puntos de quiebre

* `setBreakpoint()`, `sb()` - Establecer punto de quiebre en la línea actual
* `setBreakpoint(line)`, `sb(line)` - Colocar un punto de interrupción en una línea específica
* `setBreakpoint('fn()')`, `sb(...)` - Establecer un punto de interrupción en una primera instrucción en las funciones del programa
* `setBreakpoint('script.js', 1)`, `sb(...)` - Establezca un punto de quiebre en la primera línea de script.js
* `clearBreakpoint('script.js', 1)`, `cb(...)` - Borrar punto de quiebre en script.js en línea 1

También es posible establecer un punto de quiebre en un archivo (módulo) que no está cargado todavía:

```txt
$ node inspect main.js
< Debugger listening on ws://127.0.0.1:9229/4e3db158-9791-4274-8909-914f7facf3bd
< For help see https://nodejs.org/en/docs/inspector
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

* `backtrace`, `bt` - Imprimir backtrace del actual campo de ejecución
* `list(5)` - Enumere la fuente del código con 5 líneas de contexto (5 líneas antes y después)
* `watch(expr)` - Agregar expresión a la lista de observación
* `unwatch(expr)` - Eliminar expresión de la lista de observación
* `watchers` - Enumera todos los monitores y sus valores (enumerados automáticamente en cada punto de quiebre)
* `repl` - Abra el repl del depurador para su evaluación en el contexto del script de depuración
* `exec expr`: Ejecuta una expresión en el contexto del script de depuración

### Control de ejecución

* `ejecutar ` - Ejecutar script (se ejecuta automáticamente al inicio del depurador)
* `restart` - Reiniciar script
* `kill` - Terminar script

### Varios

* `scripts` - Listar todos los scripts cargados
* `version` - Muestra la versión de V8

## Uso avanzado

### V8 Integración del Inspector para Node.js

La integración del Inspector de V8 permite adjuntar Chrome DevTools a las instancias de Node.js para depurar y generar perfiles. It uses the [Chrome Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer/).

El inspector de V8 Inspector se puede habilitar pasando la bandera `--inspect` al iniciar una aplicación Node.js. También es posible suministrar un puerto personalizado con esa bandera, p.ej. `--inspect=9222` aceptará conexiones de DevTools en el puerto 9222.

Pase la bandera `--inspect-brk`, en vez de `--inspect`, para interrumpir la primera línea del código de aplicación.

```txt
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
Abra la siguiente URL en Chrome para iniciar la depuración: 
    chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(En el ejemplo anterior, la UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 al final de la URL es generada en la salida y varía en las diferentes sesiones de depuración)
