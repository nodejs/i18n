# Usando el módulo internal/errors.js

## Qué es internal/errors.js

El módulo `require('internal/errors')` es un módulo solo interno que se puede usar para producir instancias `Error`, `TypeError` y `RangeError` que utilizan un código de error estático, permanente y un mensaje parametrizado opcionalmente.

La intención del módulo es permitir que los errores proporcionados por Node.js tengan asignado un identificador permanente. Sin un identificador permanente, el código de usuario puede necesitar inspeccionar los mensajes de error para distinguir un error de otro. Un resultado desafortunado de esa práctica es que los cambios en los mensajes de error resultan en un código roto en el ecosistema. Por esa razón, Node.js ha considerado que los cambios en los mensajes de error son cambios de ruptura. Al proporcionar un identificador permanente para un error específico, reducimos la necesidad de un código de usuario para inspeccionar los mensajes de error.

*Nota*: Cambiar un error existente para usar el módulo `internal/errors` debe considerarse un cambio `semver-major`.

## Usando internal/errors.js

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

## Añadiendo nuevos errores

Se agregan nuevos códigos de error estáticos modificando el archivo `internal/errors.js` y agregando los nuevos códigos de error al final usando el método de utilidad `E()`.

```js
E('EXAMPLE_KEY1', 'This is the error value', TypeError);
E('EXAMPLE_KEY2', (a, b) => `${a} ${b}`, RangeError);
```

El primer argumento pasado a `E()` es el identificador estático. El segundo argumento es una String con etiquetas de reemplazo de estilo opcional `util.format()` (por ejemplo, `%s`, `%d`), o una función devolviendo una String. Los argumentos adicionales opcionales pasados a la función `errors.message()` (que es usada por las clases `errors.Error`, `errors.TypeError` y `errors.RangeError`), se utilizará para formatear el mensaje de error. El tercer argumento es la clase base que el nuevo error extenderá.

Es posible crear múltiples clases derivadas proporcionando argumentos adicionales. Las otras serán expuestas como propiedades de la clase principal:

<!-- eslint-disable no-unreachable -->

```js
E('EXAMPLE_KEY', 'Error message', TypeError, RangeError);

// In another module
const { EXAMPLE_KEY } = require('internal/errors').codes;
// TypeError
throw new EXAMPLE_KEY();
// RangeError
throw new EXAMPLE_KEY.RangeError();
```

## Documenting new errors

Whenever a new static error code is added and used, corresponding documentation for the error code should be added to the `doc/api/errors.md` file. This will give users a place to go to easily look up the meaning of individual error codes.

## Testing new errors

When adding a new error, corresponding test(s) for the error message formatting may also be required. If the message for the error is a constant string then no test is required for the error message formatting as we can trust the error helper implementation. An example of this kind of error would be:

```js
E('ERR_SOCKET_ALREADY_BOUND', 'Socket is already bound');
```

If the error message is not a constant string then tests to validate the formatting of the message based on the parameters used when creating the error should be added to `test/parallel/test-internal-errors.js`. These tests should validate all of the different ways parameters can be used to generate the final message string. A simple example is:

```js
// Test ERR_TLS_CERT_ALTNAME_INVALID
assert.strictEqual(
  errors.message('ERR_TLS_CERT_ALTNAME_INVALID', ['altname']),
  'Hostname/IP does not match certificate\'s altnames: altname');
```

In addition, there should also be tests which validate the use of the error based on where it is used in the codebase. For these tests, except in special cases, they should only validate that the expected code is received and NOT validate the message. This will reduce the amount of test change required when the message for an error changes.

```js
assert.throws(() => {
  socket.bind();
}, common.expectsError({
  code: 'ERR_SOCKET_ALREADY_BOUND',
  type: Error
}));
```

Avoid changing the format of the message after the error has been created. If it does make sense to do this for some reason, then additional tests validating the formatting of the error message for those cases will likely be required.

## API

### Object: errors.codes

Exposes all internal error classes to be used by Node.js APIs.

### Method: errors.message(key, args)

* `key` {string} The static error identifier
* `args` {Array} Zero or more optional arguments passed as an Array
* Returns: {string}

Returns the formatted error message string for the given `key`.