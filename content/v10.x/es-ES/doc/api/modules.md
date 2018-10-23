# Módulos

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

<!--name=module-->

En el sistema de módulo Node.js, cada archivo es tratado como un módulo separado. Por ejemplo, considere un archivo llamado `foo.js`:

```js
const circle = require('./circle.js');
console.log(`The area of a circle of radius 4 is ${circle.area(4)}`);
```

En la primera linea, `foo.js` carga el módulo `circle.js` que está en el mismo directorio como `foo.js`.

Aquí están los contenidos de `circle.js`:

```js
const { PI } = Math;

exports.area = (r) => PI * r ** 2;

exports.circumference = (r) => 2 * PI * r;
```

El módulo `circle.js` ha exportado las funciones `area()` y `circumference()`. Las funciones y objetos son añadidos a la raíz de un módulo especificando las propiedades adicionales en el objeto `exports` especial.

Las variables locales para el módulo serán privadas, debido a que el módulo está envuelto en una función por Node.js (vea la [envoltura del módulo](#modules_the_module_wrapper)). En este ejemplo, la variable `PI` es privada para `circle.js`.

Un nuevo valor puede ser asignado a la propiedad `module.exports` (como una función o un objeto).

Abajo, `bar.js` hace uso del módulo `square`, el cual exporta una clase Square:

```js
const Square = require('./square.js');
const mySquare = new Square(2);
console.log(`The area of mySquare is ${mySquare.area()}`);
```

El módulo `square` es definido en `square.js`:

```js
// el asignar a las exportaciones no modificará el módulo, debe usar module.exports
module.exports = class Square {
  constructor(width) {
    this.width = width;
  }

  area() {
    return this.width ** 2;
  }
};
```

El sistema de módulo es implementado en el módulo `require('module')`.

## Accediendo al módulo principal

<!-- type=misc -->

Cuando un archivo corre directamente desde Node.js, `require.main` es establecido a su `module`. Eso significa que es posible determinar si un archivo ha sido ejecutado directamente probando el `require.main === module`.

Para un archivo `foo.js`, esto será `true` si se ejecuta a través de `node foo.js`, pero será `false` si se ejecuta por `require('./foo')`.

Debido a que el `module` proporciona una propiedad `filename` (normalmente equivalente a `__filename`), el punto de entrada de la aplicación actual puede obtenerse comprobando `require.main.filename`.

## Addenda: Package Manager Tips

<!-- type=misc -->

La semántica de la función `require()` de Node.js fue diseñada para ser lo suficientemente general para soportar un número de estructuras de directorios razonable. Package manager programs such as `dpkg`, `rpm`, and `npm` will hopefully find it possible to build native packages from Node.js modules without modification.

A continuación damos una estructura de directorio sugerida que podría funcionar:

Digamos que queremos que la carpeta en `/usr/lib/node/<some-package>/<some-version>` sostenga los contenidos de una versión específica de un paquete.

Los paquetes pueden depender el uno del otro. El orden de instalación de paquetes `foo`,, puede ser necesarios para instalar una versión especifica del paquete `bar`. El paquete `bar` puede tener dependencias por sí mismo, y, en algunos casos, estas incluso pueden chocar o formar dependencias cíclicas.

Puesto que Node.js busca el `realpath` de cualquier módulo que carga (es decir, resuelve symlinks), y luego busca a sus dependencias en las carpetas `node_modules`, como se describe [aquí](#modules_loading_from_node_modules_folders), esta situación es muy sencilla de resolver con la siguiente arquitectura:

* `/usr/lib/node/foo/1.2.3/` - Contenidos del paquete `foo`, versión 1.2.3.
* `/usr/lib/node/bar/4.3.2/` - Contenidos del paquete `bar` del cual depende `foo`.
* `/usr/lib/node/foo/1.2.3/node_modules/bar` Enlace simbólico a `/usr/lib/node/bar/4.3.2/`.
* `/usr/lib/node/bar/4.3.2/node_modules/*` - Enlaces simbólicos a los paquetes de los cuales `bar` depende.

Así, incluso si se encuentra un ciclo, o si hay conflictos de dependencia, cada módulo será capaz de obtener una versión de su dependencia que puede utilizar.

When the code in the `foo` package does `require('bar')`, it will get the version that is symlinked into `/usr/lib/node/foo/1.2.3/node_modules/bar`. Luego, cuando el código en el paquete `bar` llama a `require('quux')`, obtendrá la versión que está symlinked en `/usr/lib/node/bar/4.3.2/node_modules/quux`.

Además, para hacer que el módulo busque un proceso inclusive más óptimo, antes que colocar los paquetes directamente en `/usr/lib/node`, podríamos colocarlos en `/usr/lib/node_modules/<name>/<version>`. Entonces Node.js no se preocupará en buscar dependencias faltantes en `/usr/node_modules` o `/node_modules`.

Para hacer que los módulos se encuentren disponibles para el REPL de Node.js, podría ser útil también añadir la carpeta `/usr/lib/node_modules` a la variable de entorno `$NODE_PATH`. Debido a que las búsquedas del módulo que utilizan las carpetas `node_modules` son todas relativas, y se basan en la ruta real de los archivos que hacen las llamadas a `require()`, los mismos paquetes pueden encontrarse en cualquier lugar.

## Todo Junto...

<!-- type=misc -->

Para obtener el nombre de archivo exacto que será cargado cuando se llame a `require()`, utilice la función `require.resolve()`.

Colocando todo lo de arriba junto, aquí está el algoritmo de alto nivel en pseudocódigo de lo que hace `require.resolve()`:

```txt
require(X) from module at path Y
1. If X is a core module,
   a. return the core module
   b. STOP
2. If X begins with '/'
   a. set Y to be the filesystem root
3. If X begins with './' or '/' or '../'
   a. LOAD_AS_FILE(Y + X)
   b. LOAD_AS_DIRECTORY(Y + X)
4. LOAD_NODE_MODULES(X, dirname(Y))
5. THROW "not found"

LOAD_AS_FILE(X)

1. If X is a file, load X as JavaScript text.  STOP
2. If X.js is a file, load X.js as JavaScript text.  STOP
3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
4. If X.node is a file, load X.node as binary addon.  STOP

LOAD_INDEX(X)

1. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
2. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
3. If X/index.node is a file, load X/index.node as binary addon.  STOP

LOAD_AS_DIRECTORY(X)

1. If X/package.json is a file,
   a. Parse X/package.json, and look for "main" field.
   b. let M = X + (json main field)
   c. LOAD_AS_FILE(M)
   d. LOAD_INDEX(M)
2. LOAD_INDEX(X)

LOAD_NODE_MODULES(X, START)

1. let DIRS=NODE_MODULES_PATHS(START)
2. for each DIR in DIRS:
   a. LOAD_AS_FILE(DIR/X)
   b. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)

1. let PARTS = path split(START)
2. let I = count of PARTS - 1
3. let DIRS = []
4. while I >= 0,
   a. if PARTS[I] = "node_modules" CONTINUE
   b. DIR = path join(PARTS[0 .. I] + "node_modules")
   c. DIRS = DIRS + DIR
   d. let I = I - 1
5. return DIRS
```

## Almacenamiento en Caché

<!--type=misc-->

Los módulos se almacenan en caché después de que se cargan por primera vez. This means (among other things) that every call to `require('foo')` will get exactly the same object returned, if it would resolve to the same file.

Puede que múltiples llamadas a `require('foo')` no provoquen que el código del módulo se ejecute múltiples veces. Esto es una función importante. Con ella, los objetos "parcialmente hechos" pueden devolverse, permitiendo que las dependencias transitivas se carguen incluso cuando puedan causar ciclos.

Para que un módulo ejecute un código múltiples veces, exporte una función y llame a esa función.

### Module Caching Caveats

<!--type=misc-->

Los módulos se almacenan en caché basados en su nombre de archivo resuelto. Since modules may resolve to a different filename based on the location of the calling module (loading from `node_modules` folders), it is not a *guarantee* that `require('foo')` will always return the exact same object, if it would resolve to different files.

Adicionalmente, en sistemas de archivo sensibles a mayúsculas y minúsculas o sistemas operativos, nombres de archivos resueltos diferentes pueden apuntar al mismo archivo, pero el caché todavía los tratará como diferentes módulos y cargará el archivo múltiples veces. Por ejemplo, `require('./foo')` y `require('./FOO')` devuelven dos objetos diferentes, desconsiderando si `./foo` y `./FOO` son o no el mismo archivo.

## Core Modules

<!--type=misc-->

Node.js tiene varios módulos compilados en el binario. Estos módulos son descritos con mayor detalle en otras partes de esta documentación.

The core modules are defined within Node.js's source and are located in the `lib/` folder.

Core modules are always preferentially loaded if their identifier is passed to `require()`. For instance, `require('http')` will always return the built in HTTP module, even if there is a file by that name.

## Ciclos

<!--type=misc-->

Cuando hay llamadas circulares a `require()`, un módulo podría no haber finalizado la ejecución cuando es devuelto.

Considere esta situación:

`a.js`:

```js
console.log('a starting');
exports.done = false;
const b = require('./b.js');
console.log('in a, b.done = %j', b.done);
exports.done = true;
console.log('a done');
```

`b.js`:

```js
console.log('b starting');
exports.done = false;
const a = require('./a.js');
console.log('in b, a.done = %j', a.done);
exports.done = true;
console.log('b done');
```

`main.js`:

```js
console.log('main starting');
const a = require('./a.js');
const b = require('./b.js');
console.log('in main, a.done = %j, b.done = %j', a.done, b.done);
```

Cuando `main.js` carga a `a.js`, luego el `a.js` en turno carga a `b.js`. En ese punto, `b.js` intenta cargar a `a.js`. Para prevenir un bucle infinito, una **copia sin terminar** del objeto de exportaciones `a.js` es devuelto al módulo `b.js`. `b.js` luego termina de cargar, y su objeto `exports` es proporcionado al módulo `a.js`.

Al momento en el que `main.js` ha cargado ambos módulos, ambos terminaron. La salida de este programa sería:

```txt
$ node main.js
main starting
a starting
b starting
in b, a.done = false
b done
in a, b.done = true
a done
in main, a.done = true, b.done = true
```

Hace falta una planificación cuidadosa para permitir que las dependencias de módulo cíclicas trabajen correctamente dentro de una aplicación.

## Módulos de Archivo

<!--type=misc-->

Si no se encuentra el nombre de archivo exacto, entonces Node.js intentará cargar el nombre de archivo requerido con las extensiones añadidas: `.js`, `.json` y finalmente `.node`.

Los archivos `.js` son interpretados como archivos de texto de JavaScript, y los archivos `.json` son analizados como archivos de texto JSON. Los archivos `.node` son interpretados como módulos addon compilados cargados con `dlopen`.

Un módulo requerido con `'/'` como prefijo es una ruta absoluta al archivo. Por ejemplo, `require('/home/marco/foo.js')` cargará el archivo en `/home/marco/foo.js`.

Un módulo requerido con `'./'` como prefijo es relativo al archivo que llama a `require()`. Es decir, `circle.js` debe estar en el mismo directorio que `foo.js` para que `require('./circle')` lo encuentre.

Without a leading `'/'`, `'./'`, or `'../'` to indicate a file, the module must either be a core module or is loaded from a `node_modules` folder.

Si la ruta dada no existe, `require()` arrojará un [`Error`][] con su propiedad de `code` establecida a `'MODULE_NOT_FOUND'`.

## Carpetas como Módulos

<!--type=misc-->

Es conveniente organizar los programas y librerías en directorios independientes, y luego proporcionar un punto de entrada simple a esa librería. Hay tres maneras en las cuales una carpeta puede ser pasada a `require()` como un argumento.

Lo primero es crear un archivo `package.json` en la raíz de la carpeta, el cual especifica un módulo `main`. Un ejemplo de un archivo `package.json` puede lucir así:

```json
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```

Si esto estuviese en una carpeta en `./some-library`, entonces `require('./some-library')` intentará cargar `./some-library/lib/some-library.js`.

Este es el grado de conciencia de Node.js de los archivos `package.json`.

Si el archivo especificado por la entrada `'main'` de `package.json` está perdido y no puede ser resuelto, Node.js reportará el módulo completo como perdido con el error por defecto:

```txt
Error: Cannot find module 'some-library'
```

Si no hay ningún archivo `package.json` presente en el directorio, Node.js intentará cargar un archivo `index.js` o `index.node` de ese directorio. Por ejemplo, si no hay ningún archivo `package.json` en el ejemplo anterior, entonces `require('./some-library')` intentará cargar:

* `./some-library/index.js`
* `./some-library/index.node`

## Carga desde Carpetas `node_modules`

<!--type=misc-->

Si el identificador de módulo pasado a `require()` no es un módulo [core](#modules_core_modules), y no comienza con `'/'`, `'../'` o `'./'`, Node.js empieza en el directorio primario del módulo actual, y añade `/node_modules`, e intenta cargar el módulo desde esa ubicación. Node no anexará `node_modules` a una ruta que ya termina en `node_modules`.

Si no se encuentra aquí, entonces lo mueve al directorio primario, y así, hasta que se alcance la raíz del sistema de archivo.

Por ejemplo, si el archivo en `'/home/ry/projects/foo.js'` llamó a `require('bar.js')`, entonces Node.js vería en las siguientes ubicaciones, en este orden:

* `/home/ry/projects/node_modules/bar.js`
* `/home/ry/node_modules/bar.js`
* `/home/node_modules/bar.js`
* `/node_modules/bar.js`

Esto le permite a los programas localizar sus dependencias, y así no entren en conflicto.

Es posible requerir archivos específicos o sub módulos distribuidos con un módulo incluyendo un sufijo de la ruta después del nombre del módulo. For instance `require('example-module/path/to/file')` would resolve `path/to/file` relative to where `example-module` is located. La ruta con sufijo sigue las mismas semánticas de resolución de módulo.

## Carga desde carpetas globales

<!-- type=misc -->

Si la variable de entorno `NODE_PATH` se establece a una lista delimitada por dos puntos de rutas absolutas, entonces Node.js buscará esas rutas para los módulos si no se encuentran en otros lugares.

En Windows, `NODE_PATH` es delimitada por puntos y comas (`;`) en lugar de dos puntos.

`NODE_PATH` fue originalmente creado para soportar módulos de carga de varias rutas antes de que el algoritmo de [resolución de módulo](#modules_all_together) actual fuese congelado.

`NODE_PATH` todavía es soportado, pero es menos necesario ahora que el ecosistema de Node.js ha establecido una convención para ubicar los módulos dependientes. Algunas veces las implementaciones que dependen de `NODE_PATH` muestran un comportamiento sorprendente cuando las personas no están conscientes de que `NODE_PATH` debe establecerse. Algunas veces las dependencias de un módulo cambian, causando que se cargue una versión diferente (o incluso un módulo diferente) cuando se busque a `NODE_PATH`.

Adicionalmente, Node.js buscará en las siguientes ubicaciones:

* 1: `$HOME/.node_modules`
* 2: `$HOME/.node_libraries`
* 3: `$PREFIX/lib/node`

Donde `$HOME` es el directorio de inicio del usuario, y `$PREFIX` es el `node_prefix` configurado de Node.js.

These are mostly for historic reasons.

Es altamente recomendado colocar las dependencias en la carpeta `node_modules` local. Estas serán cargadas más rápido y con mayor confianza.

## El envoltorio del módulo

<!-- type=misc -->

Antes de que se ejecute un código del módulo, Node.js lo envolverá con un envoltorio de función que luce como el siguiente:

```js
(function(exports, require, module, __filename, __dirname) {
// Module code actually lives in here
});
```

Al hacer esto, Node.js logra unas cuantas cosas:

* It keeps top-level variables (defined with `var`, `const` or `let`) scoped to the module rather than the global object.
* It helps to provide some global-looking variables that are actually specific to the module, such as: 
  * Los objetos `module` y `exports` que el implementador puede utilizar para exportar valores desde el módulo.
  * Las variables de conveniencia `__filename` y `__dirname`, que contienen el nombre de archivo absoluto del módulo y la ruta del directorio.

## El ámbito del módulo

### \_\_dirname

<!-- YAML
added: v0.1.27
-->

<!-- type=var -->

* {string}

El nombre del directorio del módulo actual. Este es el mismo que el [`path.dirname()`][] del [`__filename`][].

Ejemplo: ejecutando `node example.js` desde `/Users/mjr`

```js
console.log(__dirname);
// Imprime: /Users/mjr
console.log(path.dirname(__filename));
// Imprime: /Users/mjr
```

### \_\_filename

<!-- YAML
added: v0.0.1
-->

<!-- type=var -->

* {string}

El nombre de archivo del módulo actual. Esta es la ruta absoluta resuelta del archivo de módulo actual.

Para un programa principal, esto no es necesariamente lo mismo que el nombre de archivo utilizado en la línea de comando.

Vea [`__dirname`][] para el nombre del directorio del módulo actual.

Ejemplos:

Ejecutando `node example.js` desde `/Users/mjr`

```js
console.log(__filename);
// Imprime: /Users/mjr/example.js
console.log(__dirname);
// Imprime: /Users/mjr
```

Given two modules: `a` and `b`, where `b` is a dependency of `a` and there is a directory structure of:

* `/Users/mjr/app/a.js`
* `/Users/mjr/app/node_modules/b/b.js`

Las referencias a `__filename` dentro de `b.js` devolverán `/Users/mjr/app/node_modules/b/b.js`, mientras que las referencias a `__filename` dentro de `a.js` devolverán `/Users/mjr/app/a.js`.

### exportaciones

<!-- YAML
added: v0.1.12
-->

<!-- type=var -->

Una referencia al `module.exports` que es más corta de escribir. See the section about the [exports shortcut](#modules_exports_shortcut) for details on when to use `exports` and when to use `module.exports`.

### módulo

<!-- YAML
added: v0.1.16
-->

<!-- type=var -->

* {Object}

Una referencia al módulo actual. Vea la sección acerca de [`module` object][]. En particular, `module.exports` es utilizado para definir lo que exporta un módulo y lo hace disponibles a través de `require()`.

### require()

<!-- YAML
added: v0.1.13
-->

<!-- type=var -->

* {Function}

Para requerir módulos.

#### require.cache

<!-- YAML
added: v0.3.0
-->

* {Object}

Los módulos son almacenados en caché en este objeto cuando son requeridos. Al eliminar un valor clave de este objeto, el siguiente `require` volverá a cargar el módulo. Note que esto no aplica para [native addons](addons.html), por lo cual el volver a cargar resultará en un error.

#### require.extensions

<!-- YAML
added: v0.3.0
deprecated: v0.10.6
-->

> Estabilidad: 0 - Desaprobado

* {Object}

Instruye a `require` en cómo manejar ciertas extensiones de archivo.

Archivos de proceso con extensión `.sjs` como `.js`:

```js
require.extensions['.sjs'] = require.extensions['.js'];
```

**Desaprobado** En el pasado, esta lista ha sido utilizada para cargar módulos no-JavaScript en Node.js compilándolos bajo demanda. Sin embargo, en la práctica, hay muchas mejores maneras para hacer esto, como cargando módulos a través de algún otro programa de Node.js, o compilándolos en JavaScript antes de tiempo.

Debido a que el sistema de módulo está bloqueado, esta función probablemente nunca se irá. Sin embargo, puede tener errores sutiles y complejidades que es mejor dejar intactas.

Note que el número de operaciones de sistema de archivos que el sistema de módulo tiene que realizar para resolver una declaración `require(...)` para un nombre de archivo, escala linealmente con el número de extensiones registradas.

En otras palabras, añadir extensiones ralentiza el cargador de módulos y debe ser desalentado.

#### require.main

<!-- YAML
added: v0.1.17
-->

* {Object}

El objeto `Module` que representa el script de entrada cargado cuando se inició el proceso Node.js. Vea ["Accediendo al módulo principal"](#modules_accessing_the_main_module).

En el script `entry.js`:

```js
console.log(require.main);
```

```sh
node entry.js
```

<!-- eslint-skip -->

```js
Module {
  id: '.',
  exports: {},
  parent: null,
  filename: '/absolute/path/to/entry.js',
  loaded: false,
  children: [],
  paths:
   [ '/absolute/path/to/node_modules',
     '/absolute/path/node_modules',
     '/absolute/node_modules',
     '/node_modules' ] }
```

#### require.resolve(request[, options])

<!-- YAML
added: v0.3.0
changes:

  - version: v8.9.0
    pr-url: https://github.com/nodejs/node/pull/16397
    description: The `paths` option is now supported.
-->

* `request` {string} La ruta de módulo a resolver.
* `options` {Object} 
  * `paths` {string[]} Rutas de las cuales resolver la ubicación del módulo. Si están presentes, estas rutas son utilizadas en lugar de las rutas de resolución por defecto. Note que cada una de estas rutas es utilizada como un punto de partida para el algoritmo de resolución del módulo, lo que significa que la jerarquía de `node_modules` es verificada desde esta ubicación.
* Devuelve: {string}

Utiliza la maquinaria `require()` interna para ver la ubicación de un módulo, pero en lugar de cargar el módulo, sólo devuelve el nombre de archivo resuelto.

#### require.resolve.paths(request)

<!-- YAML
added: v8.9.0
-->

* `request` {string} La ruta de módulo cuyas rutas de búsqueda están siendo obtenidas.
* Devuelve: {string[]|null}

Returns an array containing the paths searched during resolution of `request` or `null` if the `request` string references a core module, for example `http` or `fs`.

## El Objeto `module`

<!-- YAML
added: v0.1.16
-->

<!-- type=var -->

<!-- name=module -->

* {Object}

En cada módulo, la variable libre de `module` es una referencia para el objeto que representa el módulo actual. Por conveniencia, `module.exports` también es accesible a través del módulo global `exports`. `module` is not actually a global but rather local to each module.

### module.children

<!-- YAML
added: v0.1.16
-->

* {module[]}

Los objetos de módulo requeridos por este.

### module.exports

<!-- YAML
added: v0.1.16
-->

* {Object}

El objeto `module.exports` es creado por el sistema `Module`. En alguna ocasiones esto no es aceptable; muchos desean que su módulo sea una instancia de alguna clase. Para hacer esto, asigne el objeto de exportación deseado a `module.exports`. Note que el asignar el objeto desea a `exports` simplemente volverá a atar a la variable local `exports`, lo cual probablemente no es deseado.

Por ejemplo, suponga que estamos haciendo un módulo llamado `a.js`:

```js
const EventEmitter = require('events');

module.exports = new EventEmitter();

// Trabaje un poco, y después de un tiempo, emita
// el evento 'ready' desde el módulo mismo.
setTimeout(() => {
  module.exports.emit('ready');
}, 1000);
```

Luego, en otro archivo podríamos hacer:

```js
const a = require('./a');
a.on('ready', () => {
  console.log('module "a" is ready');
});
```

Note que la asignación a `module.exports` debe hacerse inmediatamente. No puede hacerse en ningún callback. Esto no funciona:

`x.js`:

```js
setTimeout(() => {
  module.exports = { a: 'hello' };
}, 0);
```

`y.js`:

```js
const x = require('./x');
console.log(x.a);
```

#### exports shortcut

<!-- YAML
added: v0.1.16
-->

La variable `exports` está disponible dentro del ámbito a nivel de archivo del módulo, y se le asigna el valor de `module.exports` antes de que se evalúe el módulo.

Permite un atajo, para que así `module.exports.f = ...` pueda ser escrito más sucintamente como `exports.f = ...`. Sin embargo, tenga en cuenta que, como cualquier otra variable, si se le asigna un nuevo valor a `exports`, ya no estará ligado a `module.exports`:

```js
module.exports.hello = true; // Exported from require of module
exports = { hello: false };  // Not exported, only available in the module
```

Cuando la propiedad `module.exports` está siendo completamente reemplazada por un objeto nuevo, es usual reasignar también a `exports`:

<!-- eslint-disable func-name-matching -->

```js
module.exports = exports = function Constructor() {
  // ... etc.
};
```

Para ilustrar el comportamiento, imagine esta implementación hipotética de `require()`, la cual es bastante similar a lo que realmente es hecho por `require()`:

```js
function require(/* ... */) {
  const module = { exports: {} };
  ((module, exports) => {
    // Código de módulo aquí. En este ejemplo, define una función.
    function someFunc() {}
    exports = someFunc;
    // En este punto, exports ya no es un acceso directo a module.exports, y
    // este módulo todavía exportará un objeto vacío predeterminado.
    module.exports = someFunc;
    // En este punto, el módulo ahora exportará someFunc, en lugar del
    // objeto predeterminado.
  })(module, module.exports);
  return module.exports;
}
```

### module.filename

<!-- YAML
added: v0.1.16
-->

* {string}

El nombre de archivo completamente resuelto al módulo.

### module.id

<!-- YAML
added: v0.1.16
-->

* {string}

El identificador para el módulo. Típicamente, este es el nombre de archivo completamente resuelto.

### module.loaded

<!-- YAML
added: v0.1.16
-->

* {boolean}

Si el módulo terminó de cargarse o si está en proceso de carga.

### module.parent

<!-- YAML
added: v0.1.16
-->

* {module}

The module that first required this one.

### module.paths

<!-- YAML
added: v0.4.0
-->

* {string[]}

La ruta de búsqueda para el módulo.

### module.require(id)

<!-- YAML
added: v0.5.1
-->

* `id` {string}
* Devuelve: {Object} `module.exports` desde el módulo resuelto

El método `module.require` proporciona una manera de cargar un módulo como si `require()` fuese llamado desde el módulo original.

Para hacer esto, es necesario obtener una referencia al objeto `module`. Como `require()` devuelve el `module.exports`, y el `module` está típicamente *sólo* disponible dentro de un código del módulo específico, debe ser exportado explícitamente para ser usado.

## El Objeto `Module`

<!-- YAML
added: v0.3.7
-->

* {Object}

Proporciona métodos de utilidad generales al interactuar con instancias de `Module` — la variable `module` vista con frecuencia en los módulos de archivos. Accedido a través de `require('module')`.

### module.builtinModules

<!-- YAML
added: v9.3.0
-->

* {string[]}

Una lista de los nombres de todos los módulos proporcionados por Node.js. Puede ser usada para verificar si un módulo es mantenido por un tercero o no.

Note que `module` en este contexto no es el mismo objeto que es proporcionado por el [contenedor del módulo](#modules_the_module_wrapper). Para acceder a él, requiera el módulo `Module`:

```js
const builtin = require('module').builtinModules;
```