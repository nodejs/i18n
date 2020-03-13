# Uso

<!--introduced_in=v0.10.0-->
<!--type=misc-->

`node [options] [V8 options] [script.js | -e "script" | - ] [arguments]`

Por favor vea las [ Opciones de Linea de Comando](cli.html#cli_command_line_options) para obtener infomación sobre diferentes opciones y maneras de ejecutar scripts con Node.js.

## Ejemplo
Un ejemplo de un [servidor web](http.html) escrito con Node.js cuya respuesta es `"¡Hola Mundo!"`:

Los comandos mostrados en este documento comienzan con `$` o con `>` para indicar como debería aparecer en la terminal de un usuario. Do not include the `$` and `>` characters. They are there to indicate the start of each command.

Hay algunos tutoriales y ejemplos que siguen esta convención: `$` o `>` para comandos ejecutados por un usuario regular y `#` para comandos que podría ejecutar un administrado.

Las lineas que no inician con los caracteres `$` o `>` están mostrando la salida del comando anterior.

En primer lugar, asegúrese de haber descargado e instalado Node.js. Consulte [esta guia](https://nodejs.org/en/download/package-manager/) para mas información sobre la instalación.

Now, create an empty project folder called `projects`, then navigate into it. The project folder can be named based on the user's current project title, but this example will use `projects` as the project folder.

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

A continuación, cree un nuevo archivo en la carpeta `projects` y llamela `hola-mundo.js`.

En Node.js está considerado buen estilo usar guiones (`-`) o guiones bajos (`_`) para separar múltiples palabras en los nombres de archivo.

Abrir `hola-mundo.js` en cualquier editor de texto y pegue el siguiente contenido:

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

Guarde el archivo, regrese a la terminal e ingrese el siguiente comando:

```console
$ node hola-mundo.js
```

Un mensaje de salida como este debería aparecer en la terminal para indicar que Node.js guardo lo que se está ejecutando:

 ```console
 Server running at http://127.0.0.1:3000/
 ```

Luego, abrir cualquier browser y visitar la URL `http://127.0.0.1:3000`.

Si el browser muestra el string `Hello World!`, esto indica que el servidor esta funcionando.

Muchos de los ejemplos en la documentación pueden ser ejecutados de manera similar.
