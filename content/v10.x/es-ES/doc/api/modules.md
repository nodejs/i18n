# Módulos

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!--name=module-->

En el sistema de módulos de Node.js, cada archivo es tratado como un módulo separado. Por ejemplo, considere un archvio llamado `foo.js`:

```js
const circle = require('./circle.js');
console.log(`El área de un círculo de radio 4 es${circle.area(4)}`);
```

En la primera línea, `foo.js` carga el módulo `circle.js` que se encuentra en el mismo directorio que `foo.js`.

Estos son los contenidos de `circle.js`:

```js
const { PI } = Math;

exports.area = (r) => PI * r ** 2;

exports.circumference = (r) => 2 * PI * r;
```

El módulo `circle.js` ha exportado las funciones `area()` y `circumference()`. Las funciones y objetivos son añadidas a raíz de un modulo especificando propiedades adicionales en objeto especial `exports`.

Las variables locales del módulo serán privadas, porque los módulos están envueltos en una función por Node.js (véase [module wrapper](#modules_the_module_wrapper)). En este ejemplo, la variable `PI` está privada para `circle.js`.

Un nuevo valor puede ser asignado a `module.exports` (como una función u objeto).

A continuación,, `bar.js` hace uso del modulo `square` que exporta una clase cuadrada:

```js
const Square = require('./square.js');
const mySquare = new Square(2);
console.log(`El area de mySquare es ${mySquare.area()}`);
```

El módulo `square` está definido en `square.js`:

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

El sistema de módulos está implementado en el módulo `require('module')`.

## Accediendo al modulo principal

<!-- type=misc -->

Cuando un archivo es ejecutado desde Node.js, se establece `require.main` a su `module`. Eso significa que es posible determinar si un archivo fue ejecutado directamente por la prueba `require.main === module`.

Para el archivo `foo.js`, esto será `true` si se ejecuta vía `node foo.js`, pero `false` si se ejecuta por `require('./foo')`.

Porque `module` provee una propiedad `filename` (normalmente equivalente a `__filename`), el punto de entrada de la aplicación actual puede ser obtenido al chequear `require.main.filename`.

## Addenda: Tips Para El Administrador de Paquetes

<!-- type=misc -->

Las semánticas de la función de Node.js `require()` fueron diseñadas para ser lo suficientemente generales para soportar un número razonable de estructuras del directorio. Programas de administrador de paquetes cómo `dpkg`, `rpm`, y `npm` probablemente serán capaces de construir paquetes nativos de módulos de Node.js sin modificación.

Debajo damos una estructura de directorio sugerida que puede funcionar:

Digamos que desea que la carpeta contenida en `/usr/lib/node/&lt;some-package&gt;/&lt;some-version&gt;` tenga todos los contenidos de una versión específica de un paquete.

Los paquetes pueden depender los unos de los otros. El orden de instalación de paquetes `foo`,, puede ser necesarios para instalar una versión especifica del paquete `bar`. El paquete `bar` puede por si mismo tener dependencias, en algunos casos pueden tener conflictos o tener dependencias cíclicas.

Debido a que Node.js busca el `realpath` de cualquier módulo que cargue (eso es, ejecuta symlinks), y luego busca por sus dependencias en las carpetas `node_modules` como es descrito [aquí](#modules_loading_from_node_modules_folders), esta situación es muy simple de resolver con la siguiente arquitectura:

* `/usr/lib/node/foo/1.2.3/` - Contenidos del paquete `foo`, version 1.2.3.
* `/usr/lib/node/bar/4.3.2/` - Contenidos del paquete `bar` de los cuales `foo` depende.
* `/usr/lib/node/foo/1.2.3/node_modules/bar` - Vínculos simbólicos para `/usr/lib/node/bar/4.3.2/`.
* `/usr/lib/node/bar/4.3.2/node_modules/*` - Enlaces simbólicos para los paquetes de los cuales `bar` es dependiente.

De esta forma, incluso si un ciclo es encontrado, o si hay conflictos de dependencia, cualquier módulo será capaz de obtener una versión de su dependencia que pueda usar.

Cuando el código en el paquete `foo` ejecute `require('bar')`, obtendrá la versión que está symlinked a `/usr/lib/node/foo/1.2.3/node_modules/bar`. Luego, cuando el código en el paquete `bar` llame a `require('quux')`, obtendrá la versión que está symlinked a `/usr/lib/node/bar/4.3.2/node_modules/quux`.

Además, para realizar un proceso aún más óptimo de la búsqueda del módulo, en vez de colocar los paquetes directamente en `/usr/lib/node`, se podrían colocar en `/usr/lib/node_modules/&lt;name&gt;/&lt;version&gt;`. Entonces Node.js no se molestará en buscar por dependencias faltantes en `/usr/node_modules` o `/node_modules`.

Para poder hacer que los módulos estén disponibles para la REPL de Node.js, quizás sea útil añadir también la carpeta `/usr/lib/node_modules` a la variable de entorno `$NODE_PATH`. Debido a que los buscadores de módulos que usan las carpetas de `node_modules` son todos relativos, y basados en la ruta real de los archivos haciendo las llamadas a `require()`, los paquetes mismos pueden estar en cualquier lado.

## Todo junto...

<!-- type=misc -->

Para obtener el nombre de archivo exacto que será cargado cuando `require()` es llamado, usa la función `require.resolve()`.

Reuniendo todo lo anterior, aquí está el algoritmo de alto nivel en pseudocódigo de lo que hace `require.resolve()`:

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
1. let DIRS = NODE_MODULES_PATHS(START)
2. for each DIR in DIRS:
   a. LOAD_AS_FILE(DIR/X)
   b. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)
1. let PARTS = path split(START)
2. let I = count of PARTS - 1
3. let DIRS = [GLOBAL_FOLDERS]
4. while I >= 0,
   a. if PARTS[I] = "node_modules" CONTINUE
   b. DIR = path join(PARTS[0 .. I] + "node_modules")
   c. DIRS = DIRS + DIR
   d. let I = I - 1
5. return DIRS
```

## Almacenamiento

<!--type=misc-->

Los módulos se almacenan en caché después de la primera vez que se cargan. Esto significa (entre otras cosas) que cada llamada a `require('foo')` obtendrá exactamente el mismo objeto devuelto, si se resolviera en el mismo archivo.

Provided `require.cache` is not modified, multiple calls to `require('foo')` will not cause the module code to be executed multiple times. Esta es una función importante. With it, "partially done" objects can be returned, thus allowing transitive dependencies to be loaded even when they would cause cycles.

Para que un módulo ejecute un código múltiples veces, exporte una función y llame a esa función.

### Advertencias de Almacenamiento en Caché del Módulo

<!--type=misc-->

Los módulos son almacenados en el caché basados en el nombre de archivo resuelto. Debido a que los módulos pueden resolver a un nombre de archivo diferente basado en la localización del módulo de llamada (cargar de las carpetas `node_modules`), no es una *garantía* que `require('foo')` siempre devolverá el mismo objeto, si resolverá a diferentes archivos.

Adicionalmente, en sistemas de archivos o sistemas operativos no sensibles a mayúsculas y minúsculas, diferentes nombres de archivo resueltos pueden apuntar al mismo archivo, pero el caché aún los tratará como módulos diferentes y cargará el archivo múltiples veces. Por ejemplo, `require('./foo')` y `require('./FOO')` devuelven dos objetos diferentes, desconsiderando si `./foo` y `./FOO` son o no el mismo archivo.

## Módulos principales

<!--type=misc-->

Node.js tiene varios módulos compilados en el binario. Estos módulos son descritos con mayor detalle en otras partes de esta documentación.

Los módulos principales se definen en fuente de Node.js y están ubicados en la carpeta `lib/`.

Los módulos principales se cargan siempre preferencialmente si su identificador es pasado a `require()`. Por ejemplo, `require('http')` siempre devolverá el módulo construido en HTTP, incluso si hay un archivo con ese nombre.

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

Cuando `main.js` cargue `a.js`, entonces en respuesta `a.js` carga `b.js`. En ese punto, `b.js` trata de cargar `a.js`. Para prevenir un bucle infinito, una **copia no finalizada** del objeto de exportación `a.js` es devuelta al módulo `b.js`. Luego `b.js` finaliza la carga, y su objeto de `exports` es proporcionado al módulo `a.js`.

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

Si el nombre de archivo exacto no es encontrado, entonces No.js intentará cargar el nombre de archivo requerido con las extensiones añadidas: `.js`, `.json`, y finalmente `.node`.

Los archivos `.js` son interpretados como archivos de texto de JavaScript, y los archivos `.json` son analizados como archivos de texto JSON. Los archivos `.node` son interpretados como módulos de complemento compilados cargados con `dlopen`.

Un módulo requerido con `'/'` como prefijo es una ruta absoluta al archivo. Por ejemplo, `require('/home/marco/foo.js')` cargará el archivo a `/home/marco/foo.js`.

Un módulo requerido con `'./'` como prefijo es relativo al archivo que llama a `require()`. Es decir, `circle.js` debe estar en el mismo directorio que `foo.js` para que `require('./circle')` lo encuentre.

Without a leading `'/'`, `'./'`, or `'../'` to indicate a file, the module must either be a core module or is loaded from a `node_modules` folder.

Si la ruta dada no existe, `require()` arrojará un [`Error`][] con su propiedad `code` establecida a `'MODULE_NOT_FOUND'`.

## Carpetas como Módulos

<!--type=misc-->

Es conveniente organizar los programas y librerías en directorios independientes, y luego proporcionar un punto de entrada simple a esa librería. Hay tres maneras en las cuales una carpeta puede ser pasada a `require()` como un argumento.

La primera es crear un archivo `package.json` en la raíz de la carpeta, el cual especifica un módulo `main`. Un ejemplo de un archivo `package.json` puede lucir así:

```json
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```

Si esto estuviese dentro de una carpeta en `./some-library`, entonces `require('./some-library')` intentaría cargar `./some-library/lib/some-library.js`.

Este es el grado de conciencia de Node.js de los archivos `package.json`.

If there is no `package.json` file present in the directory, or if the `'main'` entry is missing or cannot be resolved, then Node.js will attempt to load an `index.js` or `index.node` file out of that directory. Por ejemplo, si no hay ningún archivo `package.json` en el ejemplo anterior, entonces `require('./some-library')` intentará cargar:

* `./some-library/index.js`
* `./some-library/index.node`

If these attempts fail, then Node.js will report the entire module as missing with the default error:

```txt
Error: No se pudo encontrar módulo 'some-library'
```

## Cargar desde las Carpetas `node_modules`

<!--type=misc-->

Si el identificador de módulo pasado a `require()` no es un módulo [principal](#modules_core_modules), y no comienza con `'/'`, `'../'`, o `'./'`, entonces Node.js comienza en el directorio primario del módulo actual, y añade `/node_modules`, e intenta cargar el módulo desde esa ubicación. Node.js will not append `node_modules` to a path already ending in `node_modules`.

Si no se encuentra aquí, entonces lo mueve al directorio primario, y así, hasta que se alcance la raíz del sistema de archivos.

Por ejemplo, si el archivo en `'/home/ry/projects/foo.js'` llamó a `require('bar.js')`, entonces Node.js buscará en las siguientes ubicaciones, en este orden:

* `/home/ry/projects/node_modules/bar.js`
* `/home/ry/node_modules/bar.js`
* `/home/node_modules/bar.js`
* `/node_modules/bar.js`

Esto le permite a los programas localizar sus dependencias, y así no entren en conflicto.

Es posible requerir archivos específicos o sub módulos distribuidos con un módulo incluyendo un sufijo de la ruta después del nombre del módulo. Por ejemplo, `require('example-module/path/to/file')` resolverá `path/to/file` relativamente a donde `example-module` esté localizado. La ruta con sufijo sigue las mismas semánticas de resolución de módulo.

## Carga desde carpetas globales

<!-- type=misc -->

Si la variable de entorno `NODE_PATH` se establece a una lista delimitada por dos puntos de rutas absolutas, entonces Node.js buscará esas rutas para los módulos si no se encuentran en otros lugares.

En Windows, `NODE_PATH` es delimitada por puntos y comas (`;`) en lugar de dos puntos.

`NODE_PATH` fue originalmente creado para soportar módulos de carga de varias rutas antes de que el algoritmo de [resolución de módulo](#modules_all_together) actual fuese congelado.

`NODE_PATH` todavía es soportado, pero es menos necesario ahora que el ecosistema de Node.js ha establecido una convención para ubicar los módulos dependientes. Algunas veces las implementaciones que dependen de `NODE_PATH` muestran un comportamiento sorprendente cuando las personas no están conscientes de que `NODE_PATH` debe establecerse. Algunas veces las dependencias de un módulo cambian, causando que se cargue una versión diferente (o incluso un módulo diferente) cuando se busque a `NODE_PATH`.

Additionally, Node.js will search in the following list of GLOBAL_FOLDERS:

* 1: `$HOME/.node_modules`
* 2: `$HOME/.node_libraries`
* 3: `$PREFIX/lib/node`

Donde `$HOME` es el directorio de inicio del usuario, y `$PREFIX` es el `node_prefix` configurado de Node.js.

Esto es principalmente debido a razones históricas.

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

- Mantiene las variables de alto nivel (definidas con `var`, `const` o `let`) enfocadas al módulo en vez de al objeto global.
- Ayuda proporcionar algunas variables de búsqueda global que verdaderamente sean específicas al módulo, como:
  - Los objetos `module` y `exports` que el implemtador puede usar para exportar valores desde el módulo.
  - Las variables de conveniencia `__filename` y `__dirname`, que contienen el nombre de archivo absoluto del módulo y la ruta del directorio.

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

El nombre de archivo del módulo actual. This is the current module file's absolute path with symlinks resolved.

Para un programa principal, esto no es necesariamente lo mismo que el nombre de archivo utilizado en la línea de comando.

Vea [`__dirname`][] para el nombre del directorio del módulo actual.

Ejemplos (en inglés):

Ejecutando `node example.js` desde `/Users/mjr`

```js
console.log(__filename);
// Imprime: /Users/mjr/example.js
console.log(__dirname);
// Imprime: /Users/mjr
```

Dados dos módulos: `a` y `b`, siendo que `b` es una dependencia de `a` y la estructura de los directorios es así:

* `/Users/mjr/app/a.js`
* `/Users/mjr/app/node_modules/b/b.js`

Las referencias a `__filename` dentro de `b.js` devolverán `/Users/mjr/app/node_modules/b/b.js`, mientras que las referencias a `__filename` dentro de `a.js` devolverán `/Users/mjr/app/a.js`.

### exportaciones
<!-- YAML
added: v0.1.12
-->

<!-- type=var -->

Una referencia al `module.exports` que es más corta de escribir. Consulte la sección sobre [exports shortcut (exportar atajos)](#modules_exports_shortcut) para obtener detalles sobre cuando usar `exports` y cuándo usar `module.exports (módulo de exportación)`.

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

Used to import modules, `JSON`, and local files. Modules can be imported from `node_modules`. Local modules and JSON files can be imported using a relative path (e.g. `./`, `./foo`, `./bar/baz`, `../foo`) that will be resolved against the directory named by [`__dirname`][] (if defined) or the current working directory.

```js
// Importing a local module:
const myLocalModule = require('./path/myLocalModule');

// Importing a JSON file:
const jsonData = require('./path/filename.json');

// Importing a module from node_modules or Node.js built-in module:
const crypto = require('crypto');
```

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

> Estabilidad: 0 - En desuso

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

#### require.resolve(request[, options])<!-- YAML
added: v0.3.0
changes:
  - version: v8.9.0
    pr-url: https://github.com/nodejs/node/pull/16397
    description: The `paths` option is now supported.
-->* `request` {string} La ruta de módulo a resolver.
* `opciones` {Object}
  * `paths` {string[]} Rutas de las cuales resolver la ubicación del módulo. If present, these paths are used instead of the default resolution paths, with the exception of [GLOBAL_FOLDERS](#modules_loading_from_the_global_folders) like `$HOME/.node_modules`, which are always included. Note that each of these paths is used as a starting point for the module resolution algorithm, meaning that the `node_modules` hierarchy is checked from this location.
* Devuelve: {string}

Utiliza la maquinaria `require()` interna para ver la ubicación de un módulo, pero en lugar de cargar el módulo, sólo devuelve el nombre de archivo resuelto.

#### require.resolve.paths(request)<!-- YAML
added: v8.9.0
-->* `request` {string} La ruta de módulo cuyas rutas de búsqueda están siendo obtenidas.
* Devuelve: {string[]|null}

Returns an array containing the paths searched during resolution of `request` or `null` if the `request` string references a core module, for example `http` or `fs`.

## El Objeto `module`<!-- YAML
added: v0.1.16
--><!-- type=var --><!-- name=module -->* {Object}

En cada módulo, la variable libre de `module` es una referencia para el objeto que representa el módulo actual. Por conveniencia, `module.exports` también es accesible a través del módulo global `exports`. `module` no es en realidad global sino local para cada módulo.

### module.children<!-- YAML
added: v0.1.16
-->* {module[]}

The module objects required for the first time by this one.

### module.exports
<!-- YAML
added: v0.1.16
-->

* {Object}

El objeto `module.exports` es creado por el sistema `Module`. En alguna ocasiones esto no es aceptable; muchos desean que su módulo sea una instancia de alguna clase. Para hacer esto, asigne el objeto de exportación deseado a `module.exports`. Note que el asignar el objeto desea a `exports` simplemente volverá a atar a la variable local `exports`, lo cual probablemente no es deseado.

For example, suppose we were making a module called `a.js`:

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

#### acceso directo de exports
<!-- YAML
added: v0.1.16
-->

La variable `exports` está disponible dentro del ámbito a nivel de archivo del módulo, y se le asigna el valor de `module.exports` antes de que se evalúe el módulo.

Permite un atajo, para que así `module.exports.f = ...` pueda ser escrito más sucintamente como `exports.f = ...`. Sin embargo, tenga en cuenta que, como cualquier otra variable, si se le asigna un nuevo valor a `exports`, ya no estará ligado a `module.exports`:

```js
module.exports.hello = true; // Exportado del requerimiento del módulo
exports = { hello: false };  // No exportado, solo disponible en el módulo
```

Cuando la propiedad `module.exports` está siendo completamente reemplazada por un objeto nuevo, es usual reasignar también a `exports`:
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

### module.id<!-- YAML
added: v0.1.16
-->* {string}

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

El módulo que primero requirió de este.

### module.paths<!-- YAML
added: v0.4.0
-->* {string[]}

La ruta de búsqueda para el módulo.

### module.require(id)<!-- YAML
added: v0.5.1
-->* `id` {string}
* Devuelve: {Object} `module.exports` desde el módulo resuelto

El método `module.require` proporciona una manera de cargar un módulo como si `require()` fuese llamado desde el módulo original.

Para hacer esto, es necesario obtener una referencia al objeto `module`. Como `require()` devuelve el `module.exports`, y el `module` está típicamente *sólo* disponible dentro de un código del módulo específico, debe ser exportado explícitamente para ser usado.

## El Objeto `Module`<!-- YAML
added: v0.3.7
-->* {Object}

Proporciona métodos de utilidad generales al interactuar con instancias de `Module` — la variable `module` vista con frecuencia en los módulos de archivos. Accedido a través de `require('module')`.

### module.builtinModules<!-- YAML
added: v9.3.0
-->* {string[]}

Una lista de los nombres de todos los módulos proporcionados por Node.js. Puede ser usada para verificar si un módulo es mantenido por un tercero o no.

Note que `module` en este contexto no es el mismo objeto que es proporcionado por el [contenedor del módulo](#modules_the_module_wrapper). Para acceder a él, requiera el módulo `Module`:

```js
const builtin = require('module').builtinModules;
```

### module.createRequireFromPath(filename)<!-- YAML
added: v10.12.0
-->* `filename` {string} Filename to be used to construct the relative require function.
* Returns: {[`require`][]} Require function

```js
const { createRequireFromPath } = require('module');
const requireUtil = createRequireFromPath('../src/utils');

// require `../src/utils/some-tool`
requireUtil('./some-tool');
```
