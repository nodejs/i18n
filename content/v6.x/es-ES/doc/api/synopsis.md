# Uso

<!--introduced_in=v0.10.0-->

<!--type=misc-->

`nodo [options] [v8 options] [script.js | -e "script"] [arguments]`

Por favor vea las [ Opciones de Linea de Comando](cli.html#cli_command_line_options) para obtener infomación sobre diferentes opciones y maneras de ejecutar scripts con Node.js.

## Ejemplo

Un ejemplo de un [servidor web](http.html) escrito con Node.js cuya respuesta es `"¡Hola Mundo!"`:

Los comandos mostrados en este documento comienzan con `$` o con `>` para indicar como debería aparecer en la terminal de un usuario. No incluir los caracteres `$` y `>` ellos están unicamente para indicar el inicio de un comando.

Hay algunos tutoriales y ejemplos que siguen esta convención: `$` o `>` para comandos ejecutados por un usuario regular y `#` para comandos que podría ejecutar un administrado.

Las lineas que no inician con los caracteres `$` o `>` están mostrando la salida del comando anterior.

En primer lugar, asegúrese de haber descargado e instalado Node.js. Consulte [esta guia](https://nodejs.org/en/download/package-manager/) para mas información sobre la instalación.

Ahora, cree una carpeta del proyecto vacía llamada `projects`, ingrese en ella: la carpeta del proyecto puede llevar el nombre del usuario pero este ejemplo utilizará `projects` como la carpeta de proyectos.

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

Abrir `hola-mundo.js` en cualquier editor de texto y pegue el siguiente contenido.

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

    console
     Server running at http://127.0.0.1:3000/`

Ahora, abra cualquier navegador web y visite `http://127.0.0.1:3000`.

Si el navegador muestra el mensaje `¡Hola, Mundo!`, indica que el servidor está funcionando.

Cualquiera de los ejemplos en el documento pueden ser ejecutado del mismo modo.