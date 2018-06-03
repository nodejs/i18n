# Uso

<!--introduced_in=v0.10.0-->

<!--type=misc-->

`node [options] [V8 options] [script.js | -e "script" | - ] [arguments]`

Por favor hacer referencia a la documentación de [Opciones de Línea de Comando](cli.html#cli_command_line_options) para obtener información sobre las diferentes opciones y formas de ejecutar scripts con Node.js.

## Ejemplo

Un ejemplo con un [servidor web](http.html) escrito con Node.js cuya respuesta es `'Hello World!'`:

Los comandos que se muestran en este documento comienzan con `$` o `>` para replicar como se verían en la terminal de un usuario. No incluir los caracteres `$` y `>` ya que están presentes solo para indicar dónde comienza cada comando.

Existen varios tutoriales y ejemplos que siguen esta convencion: `$` o `>` para comandos ejecutados como un usuario regular, y `#` para comandos que deberían ser ejecutados con permisos de administrador.

Las líneas que no comienzan con `$` o `>` generalmente están demostrando la respuesta/salida del comando anterior.

En primer lugar, asegúrese de haber descargado e instalado Node.js. Ver [esta guía](https://nodejs.org/en/download/package-manager/) para mas instrucciones de instalación.

Ahora, cree una carpeta vacía llamada `projects` e ingrese en la misma: La carpeta del Proyecto puede llevar el nombre del proyecto del usuario pero este ejemplo utilizará `projects` como la carpeta de proyectos.

Linux y Mac:

```console
$ mkdir ~/projects
$ cd ~/projects
```

Windows CMD:

```console
> mkdir %USERPROFILE%\projects
> cd %USERPROFILE%\projects
```

Windows PowerShell:

```console
> mkdir $env:USERPROFILE\projects
> cd $env:USERPROFILE\projects
```

A continuación, crear un nuevo archivo de base en la carpeta `projects` y llamarlo `hello-world.js`.

En Node.js se estila utilizar guiones (`-`) y guiones bajos (`_`) para separar varias palabras en los nombres de archivo.

Abrir `hello-world.js` en cualquier editor de texto y copiar el siguiente contenido:

```js
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World!\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

Guardar el archivo, volver a la terminal e ingresar el siguiente comando:

```console
$ node hello-world.js
```

El siguiente mensaje debería aparecer en la terminal para indicar que el server creado con Node.js está funcionando:

```console
Server running at http://127.0.0.1:3000/
```

Luego, abrir cualquier browser y visitar la URL `http://127.0.0.1:3000`.

Si el browser muestra el string `Hello World!`, esto indica que el servidor esta funcionando.

Muchos de los ejemplos en la documentación pueden ser ejecutados de manera similar.