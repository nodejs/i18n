# Utilizzo

<!--introduced_in=v0.10.0-->

<!--type=misc-->

`node [options] [V8 options] [script.js | -e "script" | - ] [arguments]`

Please see the [Command Line Options](cli.html#cli_command_line_options) document for information about different options and ways to run scripts with Node.js.

## Esempio

An example of a [web server](http.html) written with Node.js which responds with `'Hello World!'`:

Commands displayed in this document are shown starting with `$` or `>` to replicate how they would appear in a user's terminal. Do not include the `$` and `>` characters. They are there to indicate the start of each command.

There are many tutorials and examples that follow this convention: `$` or `>` for commands run as a regular user, and `#` for commands that should be executed as an administrator.

Lines that don’t start with `$` or `>` character are typically showing the output of the previous command.

Prima di tutto, assicurati di aver scaricato e installato Node.js. Visualizza [questa guida](https://nodejs.org/en/download/package-manager/) per ulteriori informazioni sull'installazione.

Now, create an empty project folder called `projects`, then navigate into it. The project folder can be named based on the user's current project title, but this example will use `projects` as the project folder.

Linux e Mac:

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

Next, create a new source file in the `projects` folder and call it `hello-world.js`.

In Node.js it is considered good style to use hyphens (`-`) or underscores (`_`) to separate multiple words in filenames.

Open `hello-world.js` in any preferred text editor and paste in the following content:

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

Salva il file, ritorna alla finestra del terminal e inserisci il seguente comando:

```console
$ node hello-world.js
```

An output like this should appear in the terminal to indicate Node.js server is running:

    console
     Server running at http://127.0.0.1:3000/

Adesso, apri un qualsiasi browser web preferito e visita l'indirizzo `http:/127.0.0.1.3000`.

If the browser displays the string `Hello, world!`, that indicates the server is working.

Molti degli esempi presenti nella documentazione possono essere eseguiti allo stesso modo.