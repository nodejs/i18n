# Usar el módulo internal/errors.js

## Qué es internal/errors.js

El módulo `requiere('internal/errors')` es un módulo solo interno que se puede usar para producir instancias `Error`, `TypeError` y `RangeError` que utilizan un código de error estático y permanente y un mensaje parametrizado opcionalmente.

La intención del módulo es permitir que los errores proporcionados por Node.js tengan asignado un identificador permanente. Sin un identificador permanente, el código de usuario puede necesitar inspeccionar los mensajes de error para disinguir un error de otro. Un resultado desafortunado de esa práctica es que los cambios en los mensajes de error resultan en un código dañado en el ecosistema. Por esa razón, Node.js ha considerado que los cambios en los mensajes de error son cambios de ruptura. Al proporcionar un identificador permanente para un error específico, reducimos la necesidad de un código de usuario para inspeccionar los mensajes de error.

Switching an existing error to use the `internal/errors` module must be considered a `semver-major` change.

## Usar internal/errors.js

El módulo `internal/errors` expone todos los errores personalizados como subclases de los errores incorporados. Después de agregarse, se puede encontrar un error en el objeto `codes`.

Por ejemplo, un `Error` existente, como:

```js
const err = new TypeError(`Expected string received ${type}`);
```

Se puede reemplazar agregando primero una nueva clave de error en el archivo `internal/errors.js`:

```js
E('FOO', 'Expected string received %s', TypeError);
```

Luego reemplazando el `new TypeError` existente en el código:

```js
const { FOO } = require('internal/errors').codes;
// ...
const err = new FOO(type);
```

## Añadir nuevos errores

Se agregan nuevos códigos de error estáticos modificando el archivo `internal/errors.js` y agregando los nuevos códigos de error al final usando el método de utilidad `E()`.

```js
E('EXAMPLE_KEY1', 'This is the error value', TypeError);
E('EXAMPLE_KEY2', (a, b) => `${a} ${b}`, RangeError);
```

El primer argumento pasado a `E()` es el identificador estático. El segundo argumento es una String con etiquetas de reemplazo de estilo opcional `util.format()` (ejemplo, `%s`, `%d`), o una función que devuelve una String. Los argumentos adicionales opcionales pasados a la función ` errors.message ()` (que es utilizada por las clases ` errores.Error `, ` errores.TypeError ` y ` errores.RangeError ` clases), se utilizará para formatear el mensaje de error. El tercer argumento es la clase base que el nuevo error extenderá.

Es posible crear múltiples clases derivadas proporcionando argumentos adicionales. Las otras serán expuestas como propiedades de la clase principal:
```js
E('EXAMPLE_KEY', 'Error message', TypeError, RangeError);

// En otro módulo 
const { EXAMPLE_KEY } = require('internal/errors').codes;
// TypeError 
arroja la nueva EXAMPLE_KEY();
// RangeError 
arroja la nueva EXAMPLE_KEY.RangeError();
```

## Documentar nuevos errores

Siempre que se agregue y use un nuevo código de error estático, la documentación correspondiente para el código de error se debe agregar al archivo `doc/api/errors.md`. Esto les dará a los usuarios un lugar donde ir para buscar fácilmente el significado de los códigos de error individuales.

## Probar nuevos errores

Al agregar un nuevo error, también se puede(n) requerir la(s) prueba(s) correspondiente(s) para el formato del mensaje de error. Si el mensaje para el error es una string constante, no se requiere ninguna prueba para el formato del mensaje de error, ya que podemos confiar en la implementación del asistente de errores. Un ejemplo de este tipo de error sería:

```js
E('ERR_SOCKET_ALREADY_BOUND', 'Socket is already bound');
```

Si el mensaje de error no es una string constante, las pruebas para validar el formato del mensaje según los parámetros utilizados al crear el error deben agregarse a `test/parallel/test-internal-errors.js`.  Estas pruebas deben validar todas las diferentes formas en que se pueden usar los parámetros para generar la string de mensaje final. Un ejemplo simple es:

```js
// // Prueba ERR_TLS_CERT_ALTNAME_INVALID
assert.strictEqual(
  errors.message('ERR_TLS_CERT_ALTNAME_INVALID', ['altname']),
  'Hostname/IP does not match certificate\'s altnames: altname');
```

Además, también debe haber pruebas que validen el uso del error en función de dónde se utiliza en el código base.  Para estas pruebas, excepto en casos especiales, solo deben validar que se recibe el código esperado y NO validar el mensaje.  Esto reducirá la cantidad de cambio de prueba requerido cuando cambie el mensaje de un error.

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

### Objeto: errors.codes

Expone todas las clases de errores internos que deben utilizar las API de Node.js.

### Método: errors.message(key, args)

* `key` {string} El identificador de error estático
* `args` {Array} Cero o más argumentos opcionales pasados como un Array
* Devuelve: {string}

Devuelve la string de mensaje de error formateada para la `key` dada.
