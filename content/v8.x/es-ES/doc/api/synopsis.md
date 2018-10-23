# Uso

<!--introduced_in=v0.10.0-->

<!--type=misc-->

`node [options] [V8 options] [script.js | -e "script" | - ] [arguments]`

Por favor vea las [ Opciones de Linea de Comando](cli.html#cli_command_line_options) para obtener infomación sobre diferentes opciones y maneras de ejecutar scripts con Node.js.

## Example

An example of a [web server](http.html) written with Node.js which responds with `'Hello World'`:

```js
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

To run the server, put the code into a file called `example.js` and execute it with Node.js:

```txt
$ node example.js
Server running at http://127.0.0.1:3000/
```

Cualquiera de los ejemplos en el documento pueden ser ejecutado del mismo modo.