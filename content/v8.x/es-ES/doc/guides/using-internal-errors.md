# Usar el módulo internal/errors.js

## Qué es internal/errors.js

El módulo `requiere('internal/errors')` es un módulo solo interno que se puede usar para producir instancias `Error`, `TypeError` y `RangeError` que utilizan un código de error estático y permanente y un mensaje parametrizado opcionalmente.

La intención del módulo es permitir que los errores proporcionados por Node.js tengan asignado un identificador permanente. Sin un identificador permanente, el código de usuario puede necesitar inspeccionar los mensajes de error para disinguir un error de otro. Un resultado desafortunado de esa práctica es que los cambios en los mensajes de error resultan en un código dañado en el ecosistema. Por esa razón, Node.js ha considerado que los cambios en los mensajes de error son cambios de ruptura. Al proporcionar un identificador permanente para un error específico, reducimos la necesidad de un código de usuario para inspeccionar los mensajes de error.

* Nota *: Cambiar un error existente para usar el módulo ` internal/ errors ` debe considerarse un cambio ` semver-major `.

## Usar internal/errors.js

El módulo `internal/errors` expone tres clases personalizadas de `Error` que están destinadas a reemplazar los objetos `Error` existentes dentro de la fuente de Node.js.

Por ejemplo, un `Error` existente, como:

```js
const err = new TypeError(`Expected string received ${type}`);
```

Se puede reemplazar agregando primero una nueva clave de error en el archivo `internal/errors.js`:

```js
E('FOO', 'Expected string received %s');
```

Luego reemplazando el `new TypeError` existente en el código:

```js
const errors = require('internal/errors');
// ...
const err = new errors.TypeError('FOO', type);
```

## Añadir nuevos errores

Se agregan nuevos códigos de error estáticos modificando el archivo `internal/errors.js` y agregando los nuevos códigos de error al final usando el método de utilidad `E()`.

```js
E('EXAMPLE_KEY1', 'This is the error value');
E('EXAMPLE_KEY2', (a, b) => `${a} ${b}`);
```

El primer argumento pasado a `E()` es el identificador estático. El segundo argumento es una String con etiquetas de reemplazo de estilo opcional `util.format()` (ejemplo, `%s`, `%d`), o una función que devuelve una String. Los argumentos adicionales opcionales pasados a la función ` errors.message ()` (que es utilizada por las clases ` errores.Error `, ` errores.TypeError ` y ` errores.RangeError ` clases), se utilizará para formatear el mensaje de error.

## Documentar nuevos errores

Siempre que se agregue y use un nuevo código de error estático, la documentación correspondiente para el código de error se debe agregar al archivo `doc/api/errors.md`. Esto les dará a los usuarios un lugar donde ir para buscar fácilmente el significado de los códigos de error individuales.

## Probar nuevos errores

Al agregar un nuevo error, también se puede(n) requerir la(s) prueba(s) correspondiente(s) para el formato del mensaje de error. Si el mensaje para el error es una string constante, no se requiere ninguna prueba para el formato del nuevo mensaje de error, ya que podemos confiar en la implementación del asistente de errores. Un ejemplo de este tipo de error sería:

```js
E('ERR_SOCKET_ALREADY_BOUND', 'Socket is already bound');
```

Si el mensaje de error no es una string constante, las pruebas para validar el formato del mensaje según los parámetros utilizados al crear el error deben agregarse a `test/parallel/test-internal-errors.js`.  Estas pruebas deben validar todas las diferentes formas en que se pueden usar los parámatros para generar la string de mensaje final. Un ejemplo simple es:

```js
// Probar ERR_TLS_CERT_ALTNAME_INVALID
assert.strictEqual(
  errors.message('ERR_TLS_CERT_ALTNAME_INVALID', ['altname']),
  'Hostname/IP does not match certificate\'s altnames: altname');
```

Además, también debe haber pruebas que validen el uso del error en función de dónde se utiliza en el código base.  Para estas pruebas, excepto en casos especiales, solo deben validar que se recibe el código esperado y NO validar el mensaje.  Esto reducirá la cantidad de cambio de prueba requerido cuando cambie el mensaje de un error.

For example:

```js
assert.throws(() => {
  socket.bind();
}, common.expectsError({
  code: 'ERR_SOCKET_ALREADY_BOUND',
  type: Error
}));
```

Evite cambiar el formato del mensaje después de que se haya creado el error. Si tiene sentido hacer esto por alguna razón, es probable que se requieran pruebas adicionales que validen el formato del mensaje de error para esos casos.

## API

### Class: errors.Error(key[, args...])

* `key` {string} El identificador de error estático
* `args...` {any} Cero o más argumentos opcionales

```js
const errors = require('internal/errors');

const arg1 = 'foo';
const arg2 = 'bar';
const myError = new errors.Error('KEY', arg1, arg2);
throw myError;
```

El mensaje de error específico para la instancia `myError` dependerá del valor asociado de `KEY` (vea "Añadir nuevos errores").

El objeto`myError` tendrá una propiedad `code` igual a la propiedad `key` y una propiedad `name` igual a `` `Error [${key}]` ``.

### Class: errors.TypeError(key[, args...])

* `key` {string} El identificador de error estático
* `args...` {any} Cero o más argumentos opcionales

```js
const errors = require('internal/errors');

const arg1 = 'foo';
const arg2 = 'bar';
const myError = new errors.TypeError('KEY', arg1, arg2);
throw myError;
```

El mensaje de error específico para la instancia `myError` dependerá del valor asociado de `KEY` (vea "Añadir nuevos errores").

El objeto `myError` tendrá una propiedad `code` igual a la propiedad `key` y una propiedad `name` igual a `` `TypeError [${key}]` ``.

### Class: errors.RangeError(key[, args...])

* `key` {string} El identificador de error estático
* `args...` {any} Cero o más argumentos opcionales

```js
const errors = require('internal/errors');

const arg1 = 'foo';
const arg2 = 'bar';
const myError = new errors.RangeError('KEY', arg1, arg2);
throw myError;
```

El mensaje de error específico para la instancia `myError` dependerá del valor asociado de `KEY` (vea "Añadir nuevos errores").

El objeto `myError` tendrá una propiedad `code` igual a la propiedad `key` y una propiedad `name` igual a `` `TypeError [${key}]` ``.

### Método: errors.message(key, args)

* `key` {string} El identificador de error estático
* `args` {Array} Cero o más argumentos opcionales pasados como un Array
* Devuelve: {string}

Devuelve la string de mensaje de error formateada para la `key` dada.
